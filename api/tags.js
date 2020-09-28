const express = require('express');
const tagsRouter = express.Router();

tagsRouter.use((req, res, next) => {
  console.log("A request is being made to /tags");
  next();
});

const { getAllTags, getPostsByTagName } = require('../db');
tagsRouter.get('/', async (req, res) => {
  const tags = await getAllTags();
  res.send({
    tags
  });
});

tagsRouter.get('/:tagName/posts', async (req, res, next) => {
    // read the tagname from the params
    const { tagName } = req.params;
    console.log('tagname ',tagName)
    try {
        console.log('req.user ',req.user)
        console.log('req.user.id ',req.user.id)
      // use our method to get posts by tag name from the db
        const tagfilter = await getPostsByTagName(tagName)
      // send out an object to the client { posts: // the posts }
      const posts = tagfilter.filter(post => {

   if (post.active) {
     return true;
  }
   if (post.authorId === req.user.id) {
     return true;
 }
     });
        console.log('posts ',posts)
        res.send({ posts })
    } catch ({ name, message }) {
      next({ name, message });
    }
  });

module.exports = tagsRouter;