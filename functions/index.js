const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret, defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

const beehiivApiKey = defineSecret("BEEHIIV_API_KEY");
const beehiivPublicationId = defineString("BEEHIIV_PUBLICATION_ID");

// Fires whenever a new doc lands in newsletterSubscribers/{email} (see
// src/components/NewsletterSignup.jsx) and pushes that subscriber into
// Beehiiv so signups on the site show up there without a manual CSV export.
exports.syncNewsletterSubscriberToBeehiiv = onDocumentCreated(
  {
    document: "newsletterSubscribers/{email}",
    secrets: [beehiivApiKey],
  },
  async (event) => {
    const email = event.data?.data()?.email;
    if (!email) {
      logger.warn("newsletterSubscribers doc created without an email field", {
        docId: event.params.email,
      });
      return;
    }

    const publicationId = beehiivPublicationId.value();
    const response = await fetch(
      `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${beehiivApiKey.value()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, reactivate_existing: true }),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      logger.error("Beehiiv subscription create failed", {
        email,
        status: response.status,
        body,
      });
      throw new Error(`Beehiiv API returned ${response.status}`);
    }

    logger.info("Synced subscriber to Beehiiv", { email });
  }
);
