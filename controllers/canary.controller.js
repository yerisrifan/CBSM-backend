const CanaryService = require("../services/canary.service");
const puppeteer = require("puppeteer");

class CanaryController {
  static async getAllCanaries(req, res) {
    try {
      const { gender, ring, status } = req.query;
      const userId = req.user.id;
      // search by status
      if (status) {
        const canaryStatus = await CanaryService.getCanaryByStatus(status);
        return res.status(200).send({
          msg: "Successfully get canary data",
          count: canaryStatus.length,
          canary: canaryStatus,
        });
      }
      // search by ring
      if (ring) {
        const _ring = decodeURIComponent(ring);
        const canary = await CanaryService.getCanariesByRing(ring);
        return res.status(200).send({
          msg: "Successfully get canary data",
          count: canary.length,
          canary,
        });
      }
      // search by gender
      if (gender) {
        const canaries = await CanaryService.getAllCanaries(userId, gender);
        return res.status(200).send({
          msg: "Successfully get canary data",
          count: canaries.length,
          canaries,
        });
      }
      // show all by user ID
      const canaries = await CanaryService.getAllCanaries(userId);
      res.status(200).send({
        msg: "Successfully get canary data",
        count: canaries.length,
        canaries,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ msg: "Error getting canary data", error });
    }
  }

  static async getCanaryById(req, res) {
    try {
      const canaryId = req.params.id;
      const userId = req.user.id;
      const canary = await CanaryService.getCanaryById(canaryId, userId);
      if (!canary) {
        return res.status(404).send({ msg: "Canary not found!" });
      }
      res.status(200).send({ msg: "Successfully get canary data", canary });
    } catch (error) {
      console.error(error);
      res.status(500).send({ msg: "Error getting canary data", error });
    }
  }

  static async createCanary(req, res) {
    try {
      const userId = req.user.id;
      const canaryData = req.body;
      console.log("canaryData", canaryData);
      const canary = await CanaryService.createCanary(userId, canaryData);
      res.status(201).send({ msg: "Canary created successfully!", canary });
    } catch (error) {
      console.error(error);
      res.status(500).send({ msg: "Error creating canary", error });
    }
  }

  static async updateCanary(req, res) {
    try {
      const canaryId = req.params.id;
      const userId = req.user.id;
      const canaryData = req.body;
      const canary = await CanaryService.updateCanary(
        canaryId,
        userId,
        canaryData
      );
      if (!canary) {
        return res.status(404).send({ msg: "Canary not found!" });
      }
      res.send({ msg: "Canary updated successfully!", canary });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error });
    }
  }

  static async deleteCanary(req, res) {
    try {
      const canaryId = req.params.id;
      await CanaryService.deleteCanary(canaryId);
      res.status(200).json({ msg: "Canary deleted successfully" });
    } catch (error) {
      if (error.message === "Canary not found") {
        res.status(404).json({ msg: "Canary not found" }); // Status 404 untuk not found
      } else if (
        error.message === "Canary cannot be deleted because it has children"
      ) {
        res
          .status(400)
          .json({ msg: "Canary cannot be deleted because it has children" }); // Status 400 untuk bad request
      } else if (
        error.message === "Canary cannot be deleted because it has paired"
      ) {
        res
          .status(400)
          .json({ msg: "Canary cannot be deleted because it has paired" }); // Status 400 untuk bad request
      } else {
        res
          .status(500)
          .json({ msg: "Error deleting canary", error: error.message }); // Status 500 untuk kesalahan server umum
      }
    }
  }

  static async addSpouse(req, res) {
    try {
      const canaryId = req.params.id;
      const spouseId = req.body.spouse_id;
      const canary = await CanaryService.addSpouse(canaryId, spouseId);
      res.send({ msg: "Spouse added successfully!", canary });
    } catch (error) {
      res.status(500).send({ error });
    }
  }

  static async addChild(req, res) {
    try {
      const userId = req.user.id;
      const childData = req.body;
      const child = await CanaryService.addChild(userId, childData);
      res.status(201).send({ msg: "Child created successfully!", child });
    } catch (error) {
      res.status(500).send({ error });
    }
  }

  static async getRelatedCanaries(req, res) {
    try {
      const canaryId = req.params.id;
      const family = await CanaryService.getRelatedCanaries(canaryId);
      res.render("family-tree", {
        familyData: family,
        family: family,
        pageTitle: family[0].data.ring + " - CBSM Family Tree",
        canaryId: canaryId,
        layout: false,
      });
    } catch (error) {
      res.status(500).send({ error });
    }
  }
  static async getCanaryByRing(req, res) {
    try {
      const { ring } = req.query;
      //const canary = await CanaryService.getCanariesByRing(ring);
      //res.status(200).send({ msg: "Successfully get canary data", canary });
    } catch (error) {
      console.error(error);
      res.status(500).send({ msg: "Error getting canary data", error });
    }
  }
  static async getCanaryByStatus(req, res) {
    try {
      const { status } = req.query;
      const canaries = await CanaryService.getCanaryByStatus(status);
      res.status(200).send({ msg: "Successfully get canary data", canaries });
    } catch (error) {
      console.error(error);
      res.status(500).send({ msg: "Error getting canary data", error });
    }
  }
  static async downloadPDF(req, res) {
    const canaryId = req.params.id;
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      // set the viewport so the chart is fully rendered
      await page.setViewport({ width: 1200, height: 800 });
      await page.goto(
        process.env.BASE_URL + `/api/canary/${canaryId}/related`,
        {
          waitUntil: "networkidle0",
        }
      );
      await page.waitForSelector("#FamilyChart");
      // create delay to wait for the chart to render

      // await page.waitForTimeout(2000);

      // waitForTimeout is not working, so we use this instead
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Hide the download button before generating PDF
      await page.evaluate(() => {
        const logoContainer = document.querySelector(".logo-container");
        if (logoContainer) logoContainer.style.display = "flex";
        const downloadButton = document.querySelector(".download-button");
        if (downloadButton) downloadButton.style.display = "none";
      });

      // Generate the PDF
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        landscape: true,
      });

      await browser.close();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=family-chart.pdf"
      );
      res.send(pdf);
    } catch (error) {
      console.error(error);
      res.status(500).send({ error });
    }
  }
}

module.exports = CanaryController;
