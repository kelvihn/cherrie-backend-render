const Banner = require('./banner.model');
const cloudinaryService = require('../../util/cloudinary');

const { deleteFile } = require('../../util/deleteFile');
const fs = require('fs');

//Create Banner
exports.store = async (req, res) => {
  try {
    if (!req.file || !req.body.url) {
      return res
        .status(200)
        .json({ status: false, message: 'Invalid Details' });
    }

    const banner = new Banner();

    const cloudinaryUrl = await cloudinaryService.uploadByType(
      req.file.path,
      'banner'
    );

    banner.url = req.body.url;
    banner.image = cloudinaryUrl;

    await banner.save();

    return res
      .status(200)
      .json({ status: true, message: 'Banner Created Successfully!', banner });
  } catch (error) {
    // Clean up local file if Cloudinary upload fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || 'Server Error' });
  }
};

//Update Banner
exports.update = async (req, res) => {
  try {
    if (!req.query.bannerId) {
      return res
        .status(200)
        .json({ status: false, message: 'Invalid Details' });
    }

    const banner = await Banner.findById(req.query.bannerId);

    if (!banner) {
      // Clean up uploaded file if banner doesn't exist
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res
        .status(200)
        .json({ status: false, message: 'Banner does not exist!' });
    }

    if (req.file) {
      try {
        // Delete old image from Cloudinary if it exists
        if (banner.image && banner.image.includes('cloudinary')) {
          const publicId = cloudinaryService.extractPublicId(banner.image);
          await cloudinaryService.deleteFile(publicId);
        }
        // If it's an old local file, delete it locally
        else if (banner.image && !banner.image.startsWith('http')) {
          const localPath = banner.image;
          if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
          }
        }

        // Upload new image to Cloudinary
        const cloudinaryUrl = await cloudinaryService.uploadByType(
          req.file.path,
          'banner'
        );
        banner.image = cloudinaryUrl;
      } catch (uploadError) {
        // Clean up local file if Cloudinary upload fails
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        throw uploadError;
      }
    }

    banner.url = req.body.url ? req.body.url : banner.url;

    await banner.save();

    return res
      .status(200)
      .json({ status: true, message: 'Banner Updated Successfully!', banner });
  } catch (error) {
    console.log(error);
    // Clean up local file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res
      .status(500)
      .json({ status: false, error: error.message || 'Server Error' });
  }
};

//Delete Banner
exports.delete = async (req, res) => {
  try {
    if (!req.query.bannerId) {
      return res
        .status(200)
        .json({ status: false, message: 'Invalid Details!' });
    }

    const banner = await Banner.findById(req.query.bannerId);

    if (!banner) {
      return res
        .status(200)
        .json({ status: false, message: 'Banner does not exist!' });
    }

    // Delete image from Cloudinary if it's a Cloudinary URL
    if (banner.image && banner.image.includes('cloudinary')) {
      try {
        const publicId = cloudinaryService.extractPublicId(banner.image);
        await cloudinaryService.deleteFile(publicId);
      } catch (deleteError) {
        console.log('Error deleting from Cloudinary:', deleteError);
        // Continue with banner deletion even if Cloudinary deletion fails
      }
    }
    // Delete local file if it's an old local file
    else if (banner.image && !banner.image.startsWith('http')) {
      const localPath = banner.image;
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }

    await banner.deleteOne();

    return res
      .status(200)
      .json({ status: true, message: 'Banner deleted successfully!' });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || 'Server Error' });
  }
};

//Get Banner
exports.index = async (req, res) => {
  try {
    const banner = await Banner.find();

    return res.status(200).json({ status: true, message: 'Success!', banner });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || 'Server Error!' });
  }
};
