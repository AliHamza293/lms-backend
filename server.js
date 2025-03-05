
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/lms', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String, // admin, teacher, student
    courses: [String]
});

const lectureSchema = new mongoose.Schema({
    course: String,
    teacher: String,
    date: String,
    time: String,
    link: String
});

const User = mongoose.model('User', userSchema);
const Lecture = mongoose.model('Lecture', lectureSchema);

// Register
app.post('/api/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, role, courses: [] });
    await newUser.save();
    res.json({ message: 'User registered' });
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, 'secretKey');
    res.json({ token, role: user.role });
});

// Create Course (Admin)
app.post('/api/admin/create-course', async (req, res) => {
    const { email, course } = req.body;
    await User.updateOne({ email }, { $push: { courses: course } });
    res.json({ message: 'Course assigned to teacher' });
});

// Schedule Lecture (Teacher)
app.post('/api/teacher/schedule-lecture', async (req, res) => {
    const newLecture = new Lecture(req.body);
    await newLecture.save();
    res.json({ message: 'Lecture scheduled' });
});

// Get Lectures (Student)
app.get('/api/student/lectures', async (req, res) => {
    const { course } = req.query;
    const lectures = await Lecture.find({ course });
    res.json(lectures);
});

// Admin Dashboard - View Scheduled Lectures
app.get('/api/admin/lectures', async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const lectures = await Lecture.find({ date: today });
    res.json(lectures);
});

app.listen(5000, () => console.log('Server running on port 5000'));
            