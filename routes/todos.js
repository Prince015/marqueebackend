const express = require('express');
const { body, validationResult } = require('express-validator');
const { Todo } = require('../models/model.js');
const { verifyToken, validateUserCredentials } = require('../middleware/userCheck.js');

const todo = express.Router();

// Route for creating todos
todo.post('/create',
    [
        body('title').notEmpty().withMessage('Title is required'),
    ], verifyToken,
    async (req, res) => {
        const { title, description } = req.body;
        console.log(req.user)
        // Validate user input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const user = req?.user?.id;
        console.log(user)
        try {
            // Create a new todo instance
            const newTodo = new Todo({
                title,
                description,
                owner: user || null,
            });

            // Save the todo to the database
            const savedTodo = await newTodo.save();

            // If user is provided, update the parent todo's nestedTodos
            if (user) {
                const parentTodo = await Todo.findById({ _id: user });
                parentTodo?.subtasks.push(savedTodo._id);
                await parentTodo?.save();
            }

            res.json(savedTodo);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

// Route for updating a todo
todo.put('/update/:id', verifyToken, [
    body('title').notEmpty().withMessage('Title is required'),
], async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;

    // Validate user input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Find the todo by ID
        const todo = await Todo.findById(id);

        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }

        // Update the todo's title
        todo.title = title || todo.title;
        todo.description = description || todo.description;

        // Save the updated todo
        const updatedTodo = await todo.save();

        res.status(200).json({ data: updatedTodo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Route for deleting a todo
todo.delete('/delete/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        // Find the todo by ID and remove it
        const deletedTodo = await Todo.findByIdAndRemove(id);

        if (!deletedTodo) {
            return res.status(404).json({ message: 'Todo not found' });
        }

        res.json({ message: 'Todo deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route for adding subtodos
todo.post('/subtodos/:id', [
    body('title').notEmpty().withMessage('Title is required'),
  ], verifyToken, async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
  
    // Validate user input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    try {
      // Find the parent todo by ID
      const parentTodo = await Todo.findById(id);
  
      if (!parentTodo) {
        return res.status(404).json({ message: 'Parent Todo not found' });
      }
  
      // Create a new subtodo
      const subTodo = new Todo({
        title,
        description,
        owner: parentTodo.owner,
        parent: parentTodo._id,
      });
  
      // Save the new subtodo
      const savedSubTodo = await subTodo.save();
  
      // Add the subtodo's ID to the parent todo's nestedTodos array
      parentTodo?.subtasks?.push(savedSubTodo._id);
      await parentTodo.save();
  
      res.status(200).json({data:savedSubTodo});
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });


  // Route for deleting subtodos
todo.delete('/deletesubtodo/:parentId/:subId',verifyToken, async (req, res) => {
    const { parentId, subId } = req.params;
  
    try {
      // Find the parent todo by ID
      const parentTodo = await Todo.findById(parentId);
  
      if (!parentTodo) {
        return res.status(404).json({ message: 'Parent Todo not found' });
      }
  
      // Check if the subtodo exists in the parent todo's nestedTodos array
      const subIndex = parentTodo.subtasks?.findIndex((id) => id.toString() === subId);
  
      if (subIndex === -1) {
        return res.status(404).json({ message: 'Subtodo not found' });
      }
  
      // Remove the subtodo from the nestedTodos array
      parentTodo.subtasks?.splice(subIndex, 1);
  
      // Save the parent todo
      await parentTodo.save();
  
      // Delete the subtodo from the database
      await Todo.findByIdAndRemove(subId);
  
      res.json({ message: 'Subtodo deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  

module.exports = todo;
