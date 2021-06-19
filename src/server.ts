require('dotenv').config();
import express from 'express';
import { sequelize } from './sequelize';
import bodyParser from 'body-parser';
import { IndexRouter } from './controllers/v0/index.router';
import { V0MODELS } from './controllers/v0/model.index';
import { deleteLocalFiles, filterImageFromURL } from './util/util';
import { requireAuth } from './controllers/v0/users/routes/auth.router';
(async () => {
  await sequelize.addModels(V0MODELS);

  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }

  await sequelize.sync();

  // Init the Express application
  const app = express();

  // Set the network port
  const port = 8080;
  app.use(express.urlencoded({ extended: false }));
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // Root Endpoint
  // Displays a simple message to the user
  app.get("/filteredimage", requireAuth, async (req, res) => {
    const isImageURL = require('valid-image-url');
    let { img_url } = req.query;
    let valid = await isImageURL(img_url);
    const imgURLForValidate = img_url.toString().split('.');

    if (!valid || imgURLForValidate[imgURLForValidate.length - 1] !== 'jpg') {  // 1. validate the image_url query
      res.status(500).send('Invalid Image');
    }

    const filtered = await filterImageFromURL(img_url.toString()); //    2. call filterImageFromURL(image_url) to filter the image

    (async () => {
      // Do something before delay
      res.status(200).sendFile(filtered); //    3. send the resulting file in the response

      //delay(1000);
      //deleteLocalFiles(filtered);  //    4. deletes any files on the server on finish of the response

    })();
  }
  );

  app.use('/api/v0/', IndexRouter)

  // Root URI call
  app.get("/", async (req, res) => {
    res.send("/api/v0/");
  });

  // Start the Server
  app.listen(port, () => {
    console.log(`server running http://localhost:${port}`);
    console.log(`press CTRL+C to stop server`);
  });

})();