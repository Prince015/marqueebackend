const express = require('express');
const { body, validationResult } = require('express-validator');
const {User} = require('../models/model.js');
const {Todo} = require('../models/model.js');
const { verifyToken } = require('../middleware/userCheck.js');

const user = express.Router();

// Route for creating todos
user.get('/gettodos', verifyToken, 
async (req, res) => {
  const user = req?.user?.id;
  console.log(user)
  try {

    // If user is provided, update the parent todo's nestedTodos
    if (user) {
      const parentTodo = await Todo.find({ owner: user, parent: null });
      
      return res.status(200).json({data:parentTodo});
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

  // Route for getting subtodos
  user.get('/getsubtodo/:parentId',verifyToken, async (req, res) => {
    const { parentId } = req.params;
  
    try {
      // Find the parent todo by ID
      const parentTodo = await Todo.findById(parentId).populate('subtasks');
  
      if (!parentTodo) {
        return res.status(404).json({ message: 'Parent Todo not found' });
      }
  
      // Retrieve the nested todos of the parent todo
      const subtodos = parentTodo.subtasks;
  
      res.status(200).json({data:subtodos});
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

module.exports = user;
