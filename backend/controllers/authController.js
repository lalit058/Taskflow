export const register = async (req, res) => {
    console.log("Data received from frontend:", req.body);
    try {
        // Get role 
        const { name, email, password, role, avatar } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "User already exists" });

        // Create user 
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'user',
            avatar: avatar || ''   // Save Base64 avatar string or empty string default
        });

        const generateToken = (id, role) => {
            return jwt.sign({ userId: id, role: role }, process.env.JWT_SECRET, {
                expiresIn: '30d',
            });
        };

        // Generate Token (JWT)
        const token = generateToken(user._id, user.role);

        res.status(201).json({
            token,
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role, 
                avatar: user.avatar,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt 
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};