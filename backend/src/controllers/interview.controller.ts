import { asyncHandler } from '../utils/asyncHandler';
import * as interviewService from '../services/interview.service';
import { listInterviewsSchema, ListInterviewsInput } from '../validators/interview.validator';

// POST /api/interviews
export const createInterview = asyncHandler(async (req, res) => {
  const interview = await interviewService.createInterview(req.userId!, req.body);
  res.status(201).json(interview);
});

// GET /api/interviews?page=&limit=
export const listInterviews = asyncHandler(async (req, res) => {
  const query = listInterviewsSchema.parse(req.query) as ListInterviewsInput;
  const result = await interviewService.listInterviews(req.userId!, query);
  res.json(result);
});

// GET /api/interviews/:id
export const getInterview = asyncHandler(async (req, res) => {
  const interview = await interviewService.getInterview(req.userId!, req.params.id);
  res.json(interview);
});

// POST /api/interviews/:id/messages
export const sendMessage = asyncHandler(async (req, res) => {
  const result = await interviewService.sendMessage(req.userId!, req.params.id, req.body);
  res.status(201).json(result);
});

// POST /api/interviews/:id/run-code
export const runCode = asyncHandler(async (req, res) => {
  const result = await interviewService.runInterviewCode(req.userId!, req.params.id, req.body);
  res.json(result);
});

// POST /api/interviews/:id/end
export const endInterview = asyncHandler(async (req, res) => {
  const interview = await interviewService.endInterview(req.userId!, req.params.id);
  res.json(interview);
});
