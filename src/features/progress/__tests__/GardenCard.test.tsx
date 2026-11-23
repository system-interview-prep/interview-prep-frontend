import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GardenCard, gardenProgress, gardenStage, lastSevenDays } from "../components/GardenCard";

describe("practice garden", () => {
  it("moves through the six stages by days practised", () => {
    expect([0, 1, 2, 3, 6, 7, 13, 14, 29, 30, 200].map(gardenStage)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
    expect(gardenProgress(6)).toEqual({ stage: 2, remaining: 1, percent: 75 });
    expect(gardenProgress(45)).toEqual({ stage: 5, remaining: 0, percent: 100 });
  });

  it("lists the last 7 days, Monday as weekday 0, shading only valid days", () => {
    const activity = {
      from: "2026-09-07",
      to: "2026-11-23",
      days: [
        { date: "2026-11-21", started: 1, valid: 1, fixed: 0 },
        { date: "2026-11-22", started: 1, valid: 0, fixed: 0 },
      ],
    };
    const week = lastSevenDays("2026-11-23", activity, true);
    expect(week.map((day) => day.date)).toEqual([
      "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22", "2026-11-23",
    ]);
    // 23/11/2026 is a Monday.
    expect(week.map((day) => day.weekday)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(week.map((day) => day.watered)).toEqual([false, false, false, false, true, false, true]);
    expect(week.filter((day) => day.today).map((day) => day.date)).toEqual(["2026-11-23"]);
  });

  it("shows the stage and the days, and leaves the action to the task card below", () => {
    const html = renderToStaticMarkup(
      <GardenCard garden={{ days: 6, wateredToday: false, dayStreak: 3 }} activity={{ from: "2026-09-07", to: "2026-11-23", days: [] }} />,
    );
    expect(html).not.toContain("<a ");
    expect(html).toContain(">3<");
    expect(html).toContain("75%");
    expect(html).toContain('aria-current="step"');
  });
});
