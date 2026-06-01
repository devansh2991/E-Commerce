const { app, connectDB } = require("../index");

module.exports = async (req, res) => {
	try {
		await connectDB();
		return app(req, res);
	} catch (err) {
		console.error('Serverless handler error:', err);
		res.statusCode = 500;
		res.end('Internal Server Error');
	}
};