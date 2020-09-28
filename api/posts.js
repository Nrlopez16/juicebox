const express = require('express');
const postsRouter = express.Router();
const { getAllPosts, createPost, updatePost, getPostById } = require('../db');
const { requireUser } = require('./utils');

postsRouter.use((req, res, next) => {
  console.log("A request is being made to /posts");

  next();
});

postsRouter.post('/', requireUser, async (req, res, next) => {
   const user = req.user
  const { authorId, title, content, tags = "" } = req.body;
  const tagArr = tags.trim().split(/\s+/)
  const postData = { authorId, title, content, tags};
  const author = [user.id, user.username, user.name, user.location]
  if (tagArr.length) {
    postData.tags = tagArr;
  }

  try {
      postData.authorId = user.id
      postData.author = author
    const post = await createPost(postData)
    console.log('this is postData ',postData)
    console.log('this is post ',post)
    if ( postData ){
      res.send({ post })
    }else{
      next({ message })
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
    const { postId } = req.params;
    const { title, content, tags } = req.body;
  
    const updateFields = {};
  
    if (tags && tags.length > 0) {
      updateFields.tags = tags.trim().split(/\s+/);
    }
  
    if (title) {
      updateFields.title = title;
    }
  
    if (content) {
      updateFields.content = content;
    }
  
    try {
      const originalPost = await getPostById(postId);
  
      if (originalPost.author.id === req.user.id) {
        const updatedPost = await updatePost(postId, updateFields);
        res.send({ post: updatedPost })
      } else {
        next({
          name: 'UnauthorizedUserError',
          message: 'You cannot update a post that is not yours'
        })
      }
    } catch ({ name, message }) {
      next({ name, message });
    }
  });

  postsRouter.delete('/:postId', requireUser, async (req, res, next) => {
    try {
      const post = await getPostById(req.params.postId);
  
      if (post && post.author.id === req.user.id) {
        const updatedPost = await updatePost(post.id, { active: false });
  
        res.send({ post: updatedPost });
      } else {
        // if there was a post, throw UnauthorizedUserError, otherwise throw PostNotFoundError
        next(post ? { 
          name: "UnauthorizedUserError",
          message: "You cannot delete a post which is not yours"
        } : {
          name: "PostNotFoundError",
          message: "That post does not exist"
        });
      }
  
    } catch ({ name, message }) {
      next({ name, message })
    }
  });

  postsRouter.get('/', async (req, res) => {
    try {
      const allPosts = await getAllPosts();
      const posts = allPosts.filter(post => {
  // the post is active, doesn't matter who it belongs to
  if (post.active) {
    return true;
  }
  // the post is not active, but it belogs to the current user
  if (req.user && post.author.id === req.user.id) {
    return true;
  }
  // none of the above are true
  return false;
});
      res.send({
        posts
      });
    } catch ({ name, message }) {
      next({ name, message });
    }
  });

module.exports = postsRouter;