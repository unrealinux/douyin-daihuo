import { describe, it, expect } from "vitest";
import { PUBLISH_CHECKLIST, checklistProgress, parseChecklist, serializeChecklist, assertPublishable, PublishBlockedError } from "@/lib/publishChecklist";

describe("parseChecklist", () => {
  it("defaults everything to false", () => {
    const state = parseChecklist(null);
    expect(Object.keys(state)).toHaveLength(PUBLISH_CHECKLIST.length);
    expect(Object.values(state).every((v) => v === false)).toBe(true);
  });

  it("reads saved true values and drops unknown keys", () => {
    const state = parseChecklist(JSON.stringify({ visual: true, ghost: true }));
    expect(state.visual).toBe(true);
    expect(state.ghost).toBeUndefined();
  });

  it("survives invalid json", () => {
    expect(parseChecklist("{oops").visual).toBe(false);
  });
});

describe("serializeChecklist", () => {
  it("round-trips through parse", () => {
    const state = parseChecklist(null);
    state.visual = true;
    state.facts = true;
    const round = parseChecklist(serializeChecklist(state));
    expect(round).toEqual(state);
  });
});

describe("checklistProgress", () => {
  it("reports incomplete and redline gaps", () => {
    const state = parseChecklist(null);
    state.visual = true;
    const p = checklistProgress(state);
    expect(p.done).toBe(1);
    expect(p.total).toBe(PUBLISH_CHECKLIST.length);
    expect(p.ready).toBe(false);
    expect(p.redlineMissing.length).toBeGreaterThan(0);
  });

  it("is ready when all checked", () => {
    const state = parseChecklist(null);
    for (const k of Object.keys(state)) state[k] = true;
    expect(checklistProgress(state).ready).toBe(true);
    expect(checklistProgress(state).redlineMissing).toHaveLength(0);
  });
});

describe("assertPublishable", () => {
  it("throws when redline items are unchecked", () => {
    const state = parseChecklist(null);
    for (const k of Object.keys(state)) state[k] = true;
    state.noBookCover = false;
    expect(() => assertPublishable(serializeChecklist(state))).toThrow(PublishBlockedError);
  });

  it("passes when all redline items are checked", () => {
    const state = parseChecklist(null);
    for (const k of Object.keys(state)) state[k] = true;
    expect(() => assertPublishable(serializeChecklist(state))).not.toThrow();
  });

  it("rejects a stored-complete schedule when the incoming checklist regresses", () => {
    const complete = parseChecklist(null);
    for (const k of Object.keys(complete)) complete[k] = true;
    const regressed = { ...complete, similarity: false };
    expect(() =>
      assertPublishable(serializeChecklist(complete), serializeChecklist(regressed))
    ).toThrow(PublishBlockedError);
  });

  it("treats a missing checklist as nothing checked", () => {
    expect(() => assertPublishable(null)).toThrow(PublishBlockedError);
  });
});
