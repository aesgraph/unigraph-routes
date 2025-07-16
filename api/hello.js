module.exports = (req, res) => {
  res.json({
    message: "Hello World",
    time: new Date().toISOString(),
  });
};
