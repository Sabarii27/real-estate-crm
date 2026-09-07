const Building = require('../models/Building');
const Project = require('../models/Project');
const Unit = require('../models/Unit');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');

// @desc    List buildings (optionally filtered by project) with unit counts
// @route   GET /api/buildings
const getBuildings = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.project) filter.project = req.query.project;

  const buildings = await Building.find(filter).populate('project', 'name location').sort({ name: 1 }).lean();

  const buildingIds = buildings.map((b) => b._id);
  const unitCounts = await Unit.aggregate([
    { $match: { building: { $in: buildingIds } } },
    {
      $group: {
        _id: '$building',
        total: { $sum: 1 },
        available: { $sum: { $cond: [{ $eq: ['$status', 'Available'] }, 1, 0] } },
      },
    },
  ]);
  const unitMap = Object.fromEntries(unitCounts.map((u) => [String(u._id), u]));

  const enriched = buildings.map((b) => ({
    ...b,
    unitCount: unitMap[String(b._id)]?.total || 0,
    availableUnitCount: unitMap[String(b._id)]?.available || 0,
  }));

  sendSuccess(res, 200, 'Buildings fetched', enriched);
});

// @desc    Get single building with units
// @route   GET /api/buildings/:id
const getBuildingById = asyncHandler(async (req, res) => {
  const building = await Building.findById(req.params.id).populate('project', 'name location');
  if (!building) throw new ApiError(404, 'Building not found');

  const units = await Unit.find({ building: building._id }).sort({ floor: 1, unitNumber: 1 });
  sendSuccess(res, 200, 'Building fetched', { building, units });
});

// @desc    Create building
// @route   POST /api/buildings
// @access  Admin
const createBuilding = asyncHandler(async (req, res) => {
  const { project, name, description } = req.body;
  if (!project || !name) throw new ApiError(400, 'Project and name are required');

  const projectExists = await Project.findById(project);
  if (!projectExists) throw new ApiError(404, 'Project not found');

  const building = await Building.create({ project, name, description });
  sendSuccess(res, 201, 'Building created successfully', building);
});

// @desc    Update building
// @route   PUT /api/buildings/:id
// @access  Admin
const updateBuilding = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const building = await Building.findById(req.params.id);
  if (!building) throw new ApiError(404, 'Building not found');

  if (name !== undefined) building.name = name;
  if (description !== undefined) building.description = description;

  await building.save();
  sendSuccess(res, 200, 'Building updated successfully', building);
});

// @desc    Delete building (only if no units reference it)
// @route   DELETE /api/buildings/:id
// @access  Admin
const deleteBuilding = asyncHandler(async (req, res) => {
  const unitCount = await Unit.countDocuments({ building: req.params.id });
  if (unitCount > 0) {
    throw new ApiError(409, 'Cannot delete a building that still has units. Remove its units first.');
  }

  const building = await Building.findByIdAndDelete(req.params.id);
  if (!building) throw new ApiError(404, 'Building not found');

  sendSuccess(res, 200, 'Building deleted successfully');
});

module.exports = { getBuildings, getBuildingById, createBuilding, updateBuilding, deleteBuilding };
