import PostMessage from '../models/postMessage.js';
import mongoose from 'mongoose';

export const getPosts = async (req, res) => {
  const { page } = req.query;
  try {
    const LIMIT = 6;
    const startIndex = (Number(page) - 1) * LIMIT; // get the starting index of every page
    const total = await PostMessage.countDocuments({});
    const posts = await PostMessage.find()
      .sort({ _id: -1 })
      .limit(LIMIT)
      .skip(startIndex);
    res.status(200).json({
      data: posts,
      currentPage: Number(page),
      totalPages: Math.ceil(total / LIMIT),
    });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getPostById = async (req, res) => {
  const { id: _id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(404).send('No post with that id');
    }
    const post = await PostMessage.findById(_id);
    res.json(post);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getPostsBySearch = async (req, res) => {
  const { searchQuery, tags } = req.query;
  try {
    const title = new RegExp(searchQuery, 'i');
    const posts = await PostMessage.find({
      $or: [{ title }, { tags: { $in: tags.split(',') } }],
    });
    res.json({ data: posts });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const createPost = async (req, res) => {
  const post = req.body;
  const newPost = new PostMessage({
    ...post,
    creator: req.userId,
  });
  try {
    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(409).json({ message: err.message });
  }
};

export const updatePost = async (req, res) => {
  const { id: _id } = req.params;
  const post = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send('No post with that id');
  }
  const updatedPost = await PostMessage.findByIdAndUpdate(_id, post, {
    new: true,
  });
  res.json(updatedPost);
};

export const deletePost = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send('This post cannot be deleted.');
  }
  const deletedPost = await PostMessage.findByIdAndDelete(_id);
  res.json(deletedPost);
};

export const likePost = async (req, res) => {
  const { id: _id } = req.params;
  if (!req.userId)
    return res.json({ message: 'You must be logged in to like a post.' });

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send('No post with that id');
  }
  const post = await PostMessage.findById(_id);
  const index = post.likes.findIndex((id) => id === String(req.userId));
  if (index === -1) {
    //like the post
    post.likes.push(req.userId);
  } else {
    //dislike the post
    post.likes = post.likes.filter((id) => id !== String(req.userId));
  }
  const updatedPost = await PostMessage.findByIdAndUpdate(_id, post, {
    new: true,
  });
  res.json(updatedPost);
};

export const commentPost = async (req, res) => {
  const { id: _id } = req.params;
  const { comment } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id))
    return res.status(404).send('No Post with that id');
  const post = await PostMessage.findById(_id);
  post.comments.push(comment);
  const updatedPost = await PostMessage.findByIdAndUpdate(_id, post, {
    new: true,
  });
  res.json(updatedPost);
};
