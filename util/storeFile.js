const firebase = require("firebase"); // reference to our db
// require("firebase/storage"); // must be required for this to work
const storage = firebase.storage().ref(); // create a reference to storage

const addImage = async (req, res) => {
  try {
    // Grab the file
    const file = req.file;
    // Format the filename
    const timestamp = Date.now();
    const name = file.originalname.split(".")[0];
    const type = file.originalname.split(".")[1];
    const fileName = `${name}_${timestamp}.${type}`;
    // Step 1. Create reference for file name in cloud storage
    const imageRef = storage.child(fileName);
    // Step 2. Upload the file in the bucket storage
    const snapshot = await imageRef.put(file.buffer);
    // Step 3. Grab the public url
    const downloadURL = await snapshot.ref.getDownloadURL();

    res.send(downloadURL);
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
};
module.exports = {
  addImage,
};
