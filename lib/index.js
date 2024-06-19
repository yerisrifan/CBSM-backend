const Canary = require("../models/canary.model");

// Function to get all related canaries
async function getAllRelatedCanaries(id) {
  const canary = await Canary.findOne({ id });
  if (!canary) {
    throw new Error("Canary not found");
  }

  let visited = new Set();
  let toVisit = [canary.id];
  let result = [];

  while (toVisit.length > 0) {
    const currentId = toVisit.pop();
    if (!visited.has(currentId.toString())) {
      visited.add(currentId.toString());
      const canary = await Canary.findOne({ id: currentId });
      if (canary) {
        result.push(canary);

        const { spouses, children, father, mother } = canary.rels;

        if (spouses.length > 0) {
          spouses.forEach((id) => {
            if (!visited.has(id.toString())) {
              toVisit.push(id);
            }
          });
        }

        if (children.length > 0) {
          children.forEach((id) => {
            if (!visited.has(id.toString())) {
              toVisit.push(id);
            }
          });
        }

        if (father && !visited.has(father.toString())) {
          toVisit.push(father);
        }

        if (mother && !visited.has(mother.toString())) {
          toVisit.push(mother);
        }
      }
    }
  }

  return result;
}

async function deleteAllRelatedCanaries(_id) {
  const canary = await Canary.findOne({ _id });
  if (!canary) {
    throw new Error("Canary not found");
  }

  let visited = new Set();
  let toVisit = [canary.id];

  while (toVisit.length > 0) {
    const currentId = toVisit.pop();
    if (!visited.has(currentId.toString())) {
      visited.add(currentId.toString());
      const currentCanary = await Canary.findOne({ id: currentId });
      if (currentCanary) {
        const { spouses, children, father, mother } = currentCanary.rels;

        if (spouses && spouses.length > 0) {
          spouses.forEach((id) => {
            if (!visited.has(id.toString())) {
              toVisit.push(id);
            }
          });
        } else {
          // jika bukan array lakukan toVisit.push(spouses)
          if (spouses && !visited.has(spouses.toString())) {
            toVisit.push(spouses);
          }
        }

        if (children && children.length > 0) {
          children.forEach((id) => {
            if (!visited.has(id.toString())) {
              toVisit.push(id);
            }
          });
        } else {
          // jika bukan array lakukan toVisit.push(children)
          if (children && !visited.has(children.toString())) {
            toVisit.push(children);
          }
        }

        if (father && !visited.has(father.toString())) {
          toVisit.push(father);
        }

        if (mother && !visited.has(mother.toString())) {
          toVisit.push(mother);
        }

        // Hapus dokumen kenari dari basis data
        //await Canary.deleteOne({ id: currentId });

        // Perbarui relasi kenari yang lain agar tidak lagi merujuk pada kenari yang dihapus
        await Canary.updateMany(
          {
            $or: [
              { "rels.spouses": currentId },
              { "rels.father": currentId },
              { "rels.mother": currentId },
              { "rels.children": currentId },
            ],
          },
          {
            $pull: {
              "rels.spouses": currentId,
              "rels.children": currentId,
            },
            $unset: {
              "rels.father": currentId,
              "rels.mother": currentId,
            },
          }
        );
      }
    }
  }
  await Canary.findOneAndDelete(_id);
}

module.exports = { getAllRelatedCanaries, deleteAllRelatedCanaries };
