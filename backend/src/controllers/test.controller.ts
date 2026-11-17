import { asyncHandler } from '../utils/asyncHandler';
import * as testService from '../services/test.service';
import { listTestsSchema } from '../validators/test.validator';

// GET /api/tests/categories
export const getCategories = asyncHandler(async (req, res) => {
  res.json(testService.getCategories());
});

// POST /api/tests
export const createTest = asyncHandler(async (req, res) => {
  const test = await testService.createTest(req.userId!, req.body);
  res.status(201).json(test);
});

// GET /api/tests?mode=&page=&limit=
export const listTests = asyncHandler(async (req, res) => {
  const query = listTestsSchema.parse(req.query);
  const result = await testService.listTests(req.userId!, query);
  res.json(result);
});

// GET /api/tests/:id
export const getTest = asyncHandler(async (req, res) => {
  const test = await testService.getTest(req.userId!, req.params.id);
  res.json(test);
});

// POST /api/tests/:id/submit
export const submitTest = asyncHandler(async (req, res) => {
  const result = await testService.submitTest(req.userId!, req.params.id, req.body);
  res.json(result);
});
