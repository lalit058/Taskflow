exports.getAllTasks = async (req, res) => {
  try {
    let query = {};

    console.log("User Role:", req.user.role);
    // If not admin, filter by the logged-in user's ID
    if (req.user.role !== 'admin') {
      query.user = req.user._id; 
    }

    const tasks = await Task.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};
