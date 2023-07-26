const express = require('express')
const fetchuser = require('../middleware/fetchuser')
const router = express.Router()
const Note = require('../models/Note')
const {body, validationResult} = require('express-validator')
var jwt = require('jsonwebtoken');
// Fetch all notes from the database  : GET "/api/notes/fetchallnotes", Require a auth token


router.get('/fetchallnotes', fetchuser, async (req, res) => {
  try {
    const notes = await Note.find({user: req.user.id})
    res.json(notes)
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Internal Server Error')
  }
})

// Add a new note using : POST "/api/notes", Requires a auth token


router.post('/addnote', fetchuser, [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('description').isLength({min: 6}).withMessage('Description must be at least 6 characters long'),
], async (req, res) => {
  const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }

  try {
    const { title, description, tag } = req.body
    if (req.errors) {
      return res.status(400).json({errors: req.errors})
    }

    const note = new Note({
      user: req.user.id,
      title,
      description,
      tag
    })

    const savedNote = await note.save()
    res.json(savedNote)
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Internal Server Error')
  }
})


// Update a note using : PUT "/api/notes/:id", Login required


router.put('/updatenote/:id', fetchuser, async (req, res) => {
  try {
    const { title, description, tag } = req.body

    const newNote = {};
    if(title){newNote.title = title};
    if(description){newNote.description = description};
    if(tag){newNote.tag = tag};

    

    let note = await Note.findById(req.params.id)
    if (!note) {
      return res.status(404).json({msg: 'Note not found'})
    }

    if(note.user.toString() !== req.user.id){
      return res.status(401).json({msg: 'Not authorized'})
    }

    updatednote = await Note.findOneAndUpdate({_id: req.params.id, user: req.user.id}, newNote, {new: true})
    res.json({updatednote})

  } catch (error) {
    console.error(error.message)
    res.status(500).send('Internal Server Error')
  }
})

// Delete a note using : DELETE "/api/notes/:id", Login required


router.delete('/deletenote/:id', fetchuser, async (req, res) => {
  try {
    let note = await Note.findById(req.params.id)
    if (!note) {
      return res.status(404).json({msg: 'Note not found'})
    }
    // Allow only the user who created the note
    if(note.user.toString() !== req.user.id){
      return res.status(401).json({msg: 'Not authorized'})
    }

    note = await Note.findOneAndRemove({_id: req.params.id, user: req.user.id})
    res.json({"Success": 'Note has been removed', note})
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Internal Server Error')
  }
})
// Archive a note using : PUT "/api/notes/:id/archive", Login required
router.put('/archive/:id', fetchuser, async (req, res) => {
  try {
    let note = await Note.findById(req.params.id)
    if (!note) {
      return res.status(404).json({msg: 'Note not found'})
    }
    // Allow only the user who created the note
    if(note.user.toString() !== req.user.id){
      return res.status(401).json({msg: 'Not authorized'})
    }

    note = await Note.findOneAndUpdate({_id: req.params.id, user: req.user.id}, {archived: true}, {new: true})
    res.json({"Success": 'Note has been archived', note})
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Internal Server Error')
  }
})

// unarchive a note using : PUT "/api/notes/:id/unarchive", Login required
router.put('/unarchive/:id', fetchuser, async (req, res) => {
  try {
    let note = await Note.findById(req.params.id)
    if (!note) {
      return res.status(404).json({msg: 'Note not found'})
    }
    // Allow only the user who created the note
    if(note.user.toString() !== req.user.id){
      return res.status(401).json({msg: 'Not authorized'})
    }

    note = await Note.findOneAndUpdate({_id: req.params.id, user: req.user.id}, {archived: false}, {new: true})
    res.json({"Success": 'Note has been unarchived', note})
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Internal Server Error')
  }
})

module.exports = router