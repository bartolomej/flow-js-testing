import path from "path";
import {
  emulator,
  init,
  getServiceAddress,
  shallPass,
  executeScript,
  sendTransaction,
} from "../src";
import { extractParameters } from "../src/interaction";
import { builtInMethods, importExists } from "../src/transformers";

// We need to set timeout for a higher number, cause some transactions might take up some time
jest.setTimeout(10000);

describe("interactions - sendTransaction", () => {
  // Instantiate emulator and path to Cadence files
  beforeEach(async () => {
    const base = path.resolve(__dirname, "../cadence");
    const port = 8080;
    await init({ base }, { port, loadManager: false });
    return emulator.start(port);
  });

  // Stop emulator, so it could be restarted
  afterEach(async () => {
    return emulator.stop();
  });

  it("should return zero offset", async () => {
    const result = await executeScript("get-block-offset");
    expect(result).toBe(0);
  });

  it("should update offset", async () => {
    const manager = await getServiceAddress();
    const result = await executeScript("get-block-offset");
    expect(result).toBe(0);

    const offset = 42;
    await shallPass(sendTransaction("set-block-offset", [manager], [offset]));
    const newOffset = await executeScript("get-block-offset");
    expect(newOffset).toBe(offset);
  });
});

describe("transformers and injectors", () => {
  it("should inject built in mock", async () => {
    // We don't need any interaction with chain, so we disable FlowManager deployment
    await init("../", { loadManager: false });

    const props = {
      code: `
      pub fun main(){
        log(getCurrentBlock().height);
      }
    `,
      transformers: [builtInMethods],
    };
    const extractor = extractParameters("script");
    const { code } = await extractor([props]);

    expect(importExists("FlowManager", code)).toBe(true);
  });
});
