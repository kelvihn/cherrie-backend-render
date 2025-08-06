const Post = require('../post/post.model');
const User = require('../user/user.model');
const Notification = require('../notification/notification.model');
const Comment = require('./comment.model');

// const config = require("../../config");
// var FCM = require("fcm-node");
// var fcm = new FCM(config.SERVER_KEY);

const admin = require('../../util/firebase');

exports.comment = async (req, res) => {
  try {
    if (!req.query.postId || !req.query.userId || !req.body.comment) {
      return res
        .status(200)
        .json({ status: false, message: 'Invalid Details' });
    }
    const user = await User.findById(req.query.userId);
    const post = await Post.findById(req.query.postId);
    if (!user || !post) {
      return res
        .status(200)
        .json({ status: false, message: "UserId Or PostId Doesn't Match" });
    }

    const comment = await new Comment();

    comment.postId = post._id;
    comment.userId = user._id;
    comment.comment = req.body.comment;
    comment.date = new Date().toLocaleString('en-US', {
      timeZone: 'Africa/Lagos',
    });

    await comment.save();

    const receiverId = await User.findById(post.userId);

    const payload = {
      notification: {
        title: user.name,
        body: post.description,
        image: post?.postImage || '', // image supported in `notification` payload
      },
      data: {
        data: JSON.stringify({}), // stringified object (required for Admin SDK)
        type: 'ADMIN',
      },
      token: receiverId.fcm_token, // note: 'token' instead of 'to'
    };

    try {
      const response = await admin.messaging().send(payload);
      console.log('Successfully sent with response: ', response);
      console.log('###################################### ', response);

      const notification = new Notification();
      notification.receiverId = receiverId._id;
      notification.type = 3;
      notification.userId = user._id;
      notification.comment = comment.comment;
      notification.postImage = post.postImage;
      notification.description = post.description;
      await notification.save();
    } catch (err) {
      console.error('Something has gone wrong!', err);
    }

    return res.status(200).json({
      status: true,
      message: 'Successfully Comment......!',
      comment,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || 'Server Error' });
  }
};

exports.showComment = async (req, res) => {
  try {
    if (!req.query.postId) {
      return res
        .status(200)
        .json({ status: false, message: 'Invalid Details' });
    }
    const post = await Post.findById(req.query.postId);
    if (!post) {
      return res
        .status(200)
        .json({ status: false, message: "postId Doesn't Match" });
    }

    // const comment = await Comment.find({ postId: post._id });

    const comment = await Comment.aggregate([
      {
        $match: { postId: post._id },
      },
      {
        $lookup: {
          from: 'users',
          as: 'userId',
          let: { userId: '$userId' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$$userId', '$_id'] } },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$userId',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $project: {
          _id: 1,
          postId: 1,
          comment: 1,
          createdAt: 1,
          date: 1,
          userId: '$userId._id',
          profileImage: '$userId.profileImage',
          name: '$userId.name',
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: 'Successfully Comment......!',
      comment,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || 'Server Error' });
  }
};
