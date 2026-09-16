// Express 4 doesn't forward rejected promises from async handlers to the
// error middleware on its own — this wrapper does that.
export default function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
