import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const fixturePath = path.resolve("tests/fixtures/onenote-level-hints-sample.json");
const outputPath = path.resolve("tests/outputs/onenote-level-hints-result.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const LIST_LEVEL_TOLERANCE_PX = 18;

const stripLeadingBullet = value =>
  value
    .replace(/^\s*[•·▪▫◦○●■□‣⁃-]+\s*/, "")
    .replace(/^\s*[oO](?=\s|[A-ZÁÉÍÓÚÑ])\s*/, "");

const normalizeForDomLookup = value =>
  stripLeadingBullet(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const parsePx = value => {
  const parsedValue = Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const rawElementsToDomTextItems = rawElements =>
  rawElements
    .filter(element => ["TextRun", "NormalTextRun"].includes(element.className))
    .map((element, index) => ({
      index,
      text: element.text,
      closestListText: element.closestListText,
      className: element.className,
      tagName: element.tag,
      rectLeft: Number(element.rectLeft) || 0,
      listItemRectLeft: 0,
      markerRectLeft: 0,
      markerMarginLeft: parsePx(element.marginLeft),
      computedLevelHint: Number(element.computedLevelHint) || 0,
      ariaLevel: 0,
      listStyleType: element.listStyleType
    }));

const getDomHintScore = (item, hint, lastMatchedIndex) => {
  const itemText = normalizeForDomLookup(item.text);
  const hintText = normalizeForDomLookup(hint.text);
  const closestListText = normalizeForDomLookup(hint.closestListText);

  if (!itemText || !hintText) return Number.NEGATIVE_INFINITY;

  let score = Number.NEGATIVE_INFINITY;

  if (hintText === itemText) score = 10000;
  else if (closestListText === itemText) score = 8000;
  else if (closestListText.includes(itemText)) score = 5000;
  else if (itemText.includes(hintText) && hintText.length >= 20) score = 2000;

  if (!Number.isFinite(score)) return score;

  if (hint.index > lastMatchedIndex) score += 500;
  if (hint.className.includes("NormalTextRun")) score += 80;
  if (hint.className.includes("TextRun")) score += 40;

  score -= Math.abs(hintText.length - itemText.length);

  return score;
};

const findBestSequentialDomHints = (items, domTextItems) => {
  let lastMatchedIndex = -1;

  return items.map(item => {
    const candidates = domTextItems
      .map(hint => ({ hint, score: getDomHintScore(item, hint, lastMatchedIndex) }))
      .filter(candidate => Number.isFinite(candidate.score))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.hint.index - b.hint.index;
      });

    const bestFutureCandidate = candidates.find(candidate => candidate.hint.index > lastMatchedIndex);
    const bestCandidate = bestFutureCandidate ?? candidates[0];

    if (!bestCandidate) return { item };

    lastMatchedIndex = bestCandidate.hint.index;
    return { item, hint: bestCandidate.hint };
  });
};

const getNumericLevelSource = hint => {
  if (Number.isFinite(hint.rectLeft) && hint.rectLeft > 0) return hint.rectLeft;
  if (Number.isFinite(hint.listItemRectLeft) && hint.listItemRectLeft > 0) return hint.listItemRectLeft;
  if (Number.isFinite(hint.computedLevelHint) && hint.computedLevelHint > 0) return hint.computedLevelHint;
  return 0;
};

const buildLevelGroups = matchedHints =>
  matchedHints
    .map(matchedHint => matchedHint.hint)
    .filter(Boolean)
    .map(getNumericLevelSource)
    .filter(value => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b)
    .reduce((groups, value) => {
      const lastGroup = groups.at(-1);
      if (lastGroup === undefined || Math.abs(value - lastGroup) > LIST_LEVEL_TOLERANCE_PX) {
        groups.push(value);
      }
      return groups;
    }, []);

const getGroupedLevel = (value, groups) => {
  if (!groups.length || !Number.isFinite(value) || value <= 0) return 0;

  return groups.reduce((bestIndex, groupValue, index) => {
    const bestDistance = Math.abs(value - groups[bestIndex]);
    const currentDistance = Math.abs(value - groupValue);
    return currentDistance < bestDistance ? index : bestIndex;
  }, 0);
};

const applyDomLevelsToList = (items, domTextItems) => {
  const matchedHints = findBestSequentialDomHints(items, domTextItems);
  const levelGroups = buildLevelGroups(matchedHints);

  return {
    levelGroups,
    matchedHints: matchedHints.map(({ item, hint }) => ({
      itemText: item.text,
      matchedText: hint?.text ?? null,
      rectLeft: hint ? getNumericLevelSource(hint) : null,
      originalLevel: item.level,
      inferredLevel: hint ? getGroupedLevel(getNumericLevelSource(hint), levelGroups) : item.level
    })),
    result: matchedHints.map(({ item, hint }) => ({
      ...item,
      level: hint ? getGroupedLevel(getNumericLevelSource(hint), levelGroups) : item.level
    }))
  };
};

const domTextItems = rawElementsToDomTextItems(fixture.rawElements);
const result = applyDomLevelsToList(fixture.parsedListItemsBeforeDomHints, domTextItems);

assert.deepEqual(result.result, fixture.expectedAfterDomHints);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

console.log("PASS: OneNote DOM rectLeft grouping detects nested list levels.");
console.log(JSON.stringify(result, null, 2));
