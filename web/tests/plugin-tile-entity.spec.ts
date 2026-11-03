// A plugin tile of an entity (its manifest's `domains`): the inspector offers the entities of those domains in a list
// that searches as the person types (UiPicker), says the chosen one by its name, and takes it away again.
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const setTileOption = vi.fn();
vi.mock("../src/editor/tiles", () => ({ setTileOption: (...args: unknown[]) => setTileOption(...args), removeTile: vi.fn() }));

import PluginTileInspector from "../src/components/PluginTileInspector.vue";
import UiPicker from "../src/components/ui/UiPicker.vue";
import { useInventoryStore } from "../src/stores/inventory";
import { usePluginsStore } from "../src/stores/plugins";

const plugin = { id: "keys", name: { en: "Keys" }, icon: "F033E",
  tiles: [{ id: "pad", name: { en: "Pad" }, icon: "F033E", min: "1x1", max: "2x2", domains: ["lock"] }] };
const inspector = (entity = "") =>
  mount(PluginTileInspector, { attachTo: document.body,
    props: { tile: { entity: "plugin:keys.pad", name: "", options: entity ? { plugin_entity: entity } : {} } as any } });

beforeEach(() => {
  setTileOption.mockClear();
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
  useInventoryStore().inventory = { screens: [], entities: [
    { id: "lock.front_door", name: "Front door", state: "locked" }, { id: "light.kitchen", name: "Kitchen", state: "on" }] } as any;
  usePluginsStore().index = [plugin] as any;
});

describe("a plugin tile's own entity", () => {
  it("is chosen in a searchable list of its domains' entities", () => {
    const picker = inspector().getComponent(UiPicker);
    expect((picker.props("items") as readonly { id: string }[]).map((item) => item.id)).toEqual(["lock.front_door"]);
    picker.vm.$emit("pick", "lock.front_door");
    expect(setTileOption).toHaveBeenCalledWith(expect.anything(), "plugin_entity", "lock.front_door");
  });

  it("says the chosen entity by its name and takes it away again", async () => {
    const view = inspector("lock.front_door");
    expect(view.get("#plugin-entity-choose").text()).toContain("Front door");
    await view.get(`[aria-label="Remove Front door"]`).trigger("click");
    expect(setTileOption).toHaveBeenCalledWith(expect.anything(), "plugin_entity", "");
  });
});
