import { ACTIVE_QUERIES, BODY_SIZE } from "../constants";
import {
  CHILDREN_KEY,
  IncomingNode,
  NODE_ATTRIBUTES,
  PPage,
  PPAGE_KEY,
  PRef,
  STRING_KEY,
  TIME_KEY,
  TITLE_KEY,
  UID_KEY,
} from "../types";

const getStringAndChildrenString = (incomingNode: IncomingNode): any => {
  const strings: string[] = [incomingNode[TITLE_KEY]];
  const queue = [incomingNode];
  let lengthCount = 0;

  while (lengthCount < BODY_SIZE && queue.length > 0) {
    const node = queue.shift();

    if (node[STRING_KEY]) {
      strings.push(node[STRING_KEY]);
      lengthCount += node?.[STRING_KEY]?.length ?? 0;
    }

    if (lengthCount < BODY_SIZE && node[CHILDREN_KEY]) {
      queue.push(...node[CHILDREN_KEY]);
    }
  }

  return strings.join(" ");
};

const isTitleOrUidDailyPage = (title: string, uid: string) => {
  return (
    /\d{2}-\d{2}-\d{4}/.test(uid) ||
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s[0-9]+(st|th|rd),\s([0-9]){4}/.test(
      title
    )
  );
};

const pageToNodeAttributes = (page: PPage): NODE_ATTRIBUTES => {
  return {
    title: page[TITLE_KEY],
    uid: page[UID_KEY],
    time: page[TIME_KEY],
  };
};

const getPagesAndBlocksWithRefs = (): {
  pages: Map<string, IncomingNode>;
  blocksWithRefs: [PRef][];
} => {
  const pageMap = new Map<string, IncomingNode>();
  const pages: [PPage][] = window.roamAlphaAPI.data.fast.q(`
    [ :find (pull ?e
        [
          :node/title
          :edit/time
          :block/uid
          :block/string
          :block/children
            {:block/children ...}
        ]
      ) :where [?e :node/title]
    ]
  `) as [PPage][];

  pages.forEach((pPageArr) => {
    pageMap.set(pPageArr[0][TITLE_KEY], pPageArr[0]);
  });

  const blocksWithRefs: [PRef][] = window.roamAlphaAPI.data.fast.q(
    `
    [ :find (pull ?e
        [
          :node/title
          :block/uid
          :block/refs
          {:block/refs ...}
          :block/page
           {:block/page ...}
        ]
      ) :where [?e :block/refs]
    ]
  `
  ) as [PRef][];

  return { pages: pageMap, blocksWithRefs };
};

export {
  getStringAndChildrenString,
  isTitleOrUidDailyPage,
  getPagesAndBlocksWithRefs,
  pageToNodeAttributes,
};
