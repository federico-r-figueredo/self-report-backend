const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const cors = require('cors')({
  origin: true,
});

admin.initializeApp(functions.config().firebase);
const env = functions.config();

const DOMAIN = env.host.domain;
const REGION = env.host.region;

const DB_INDIVIDUAL_REPORT_DEV = env.db.dev;
const DB_INDIVIDUAL_REPORT = env.db.report;
const DB_INDIVIDUAL_REPORT_V2 = env.db.report2;
const DB_INDIVIDUAL_REPORT_V2_SUSPICIOUS = env.db.suspicious;

const HTTP_OK = 200;

const RECAPTCHA_SECRET = env.recaptcha.secret;
const RECAPTCHA_VERIFY_URL = env.recaptcha.verifyurl;

exports.report = functions.region(REGION).https.onRequest(async (req, res) =>
    cors(req, res, async () => {
      console.log('Report request received');

      //Front-end will send the token
      const {token, symptoms, locator, sessionId, diagnostic} = req.body;
      const db = admin.firestore();

      if (token === undefined) return res.status(400).send('token is missing');
      if (locator === undefined) return res.status(400).send('postal code is missing');
      if (sessionId === undefined) return res.status(400).send('session id is missing');
      if (diagnostic === undefined) return res.status(400).send('diagnostic is missing');

      console.log('Report data is valid');

      try {
        console.log('Verifying recaptcha token');
        const response = await axios.post(
            `${RECAPTCHA_VERIFY_URL}?secret=${RECAPTCHA_SECRET}&response=${token}`,
            {},
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
              },
            },
        );

        const data = response.data;
        console.log('Token verification finished', data);

        if (!data.success) {
          console.error('recaptcha token is not valid');
          return res.status(400).send('Recaptcha token is not valid');
        }

        console.log('recaptcha token is valid, score:', data.score);
        const suspicious = data.score < 0.7;

        const targetDb = suspicious ? DB_INDIVIDUAL_REPORT_V2_SUSPICIOUS : DB_INDIVIDUAL_REPORT_V2;

        try {
          const report = {
            locator,
            sessionId,
            symptoms,
            diagnostic,
            timestamp: new Date(),
            score: data.score,
          };
          console.log('Adding report to DB: ', targetDb, report);
          await db.collection(targetDb).add(report);

          console.log('Report added');
          res.status(HTTP_OK).send('');

        } catch (error) {
          console.log('Error adding the report to the database', error);
          res.status(500).send(`Could not register your report: ${error}`);
        }

      } catch (error) {
        console.log('error during recaptcha verification', error);
        res.status(500).send(error);
      }
    })
);
