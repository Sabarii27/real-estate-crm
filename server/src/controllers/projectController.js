const Project = require('../models/Project');
const Building = require('../models/Building');
const Unit = require('../models/Unit');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');

// @desc    List all projects (with building/unit counts)
// @route   GET /api/projects
const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find().sort({ createdAt: -1 }).lean();

  const projectIds = projects.map((p) => p._id);
  const [buildingCounts, unitCounts] = await Promise.all([
    Building.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$project', count: { $sum: 1 } } },
    ]),
    Unit.aggregate([
      { $match: { project: { $in: projectIds } } },
      {
        $group: {
          _id: '$project',
          total: { $sum: 1 },
          available: { $sum: { $cond: [{ $eq: ['$status', 'Available'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const buildingMap = Object.fromEntries(buildingCounts.map((b) => [String(b._id), b.count]));
  const unitMap = Object.fromEntries(unitCounts.map((u) => [String(u._id), u]));

  const enriched = projects.map((p) => ({
    ...p,
    buildingCount: buildingMap[String(p._id)] || 0,
    unitCount: unitMap[String(p._id)]?.total || 0,
    availableUnitCount: unitMap[String(p._id)]?.available || 0,
  }));

  sendSuccess(res, 200, 'Projects fetched', enriched);
});

// @desc    Get single project with its buildings
// @route   GET /api/projects/:id
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  const buildings = await Building.find({ project: project._id }).sort({ name: 1 });
  sendSuccess(res, 200, 'Project fetched', { project, buildings });
});

// @desc    Create project
// @route   POST /api/projects
// @access  Admin
const createProject = asyncHandler(async (req, res) => {
  const { name, location, description } = req.body;
  if (!name || !location) throw new ApiError(400, 'Name and location are required');

  const project = await Project.create({ name, location, description });
  sendSuccess(res, 201, 'Project created successfully', project);
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Admin
const updateProject = asyncHandler(async (req, res) => {
  const { name, location, description } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  if (name !== undefined) project.name = name;
  if (location !== undefined) project.location = location;
  if (description !== undefined) project.description = description;

  await project.save();
  sendSuccess(res, 200, 'Project updated successfully', project);
});

// @desc    Delete project (only if no buildings/units reference it)
// @route   DELETE /api/projects/:id
// @access  Admin
const deleteProject = asyncHandler(async (req, res) => {
  const buildingCount = await Building.countDocuments({ project: req.params.id });
  if (buildingCount > 0) {
    throw new ApiError(409, 'Cannot delete a project that still has buildings. Remove its buildings first.');
  }

  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  sendSuccess(res, 200, 'Project deleted successfully');
});

module.exports = { getProjects, getProjectById, createProject, updateProject, deleteProject };
