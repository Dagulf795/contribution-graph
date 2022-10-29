import gridStyles from "../styles/grid.module.css";
import styles from "../styles/sp-body.module.css";
import { SelectablePage, SHORTEST_PATH_KEY, SP_STATUS } from "../types";
import DebugObject from "./debug-object";
import { Spinner, Card, ProgressBar } from "@blueprintjs/core";
import PageSelect from "./page/page-select";
import { CHUNK_SIZE, INITIAL_LOADING_INCREMENT } from "../constants";
import { initializeEmbeddingWorker } from "../services/embedding-worker-client";
import useGraph from "../hooks/useGraph";
import { ShortestPathLengthMapping } from "graphology-shortest-path/unweighted";
import useIdb from "../hooks/useIdb";
import * as React from "react";
import { EMBEDDINGS_STORE, SIMILARITIES_STORE } from "../services/idb";
import { dot } from "mathjs";

export const SpBody = () => {
  const [addApexPage, addActivePages, idb, activePageIds, apexPageId] = useIdb();
  const [status, setStatus] = React.useState<SP_STATUS>("CREATING_GRAPH");
  const [graph, initializeGraph, roamPages, selectablePages] = useGraph();
  const [loadingIncrement, setLoadingIncrement] = React.useState<number>(0);
  const [pagesLeft, setPagesLeft] = React.useState<number>(0);

  React.useEffect(() => {
    if (graph.size === 0) {
      window.setTimeout(() => {
        const initializeGraphAsync = async () => {
          await initializeGraph();
          setStatus("GRAPH_INITIALIZED");
        };
        initializeGraphAsync();
      }, 10);
    }
  }, [graph, initializeGraph]);

  const pageSelectCallback = React.useCallback(
    (selectedPage: SelectablePage) => {
      if (idb.current && selectedPage) {
        setLoadingIncrement(INITIAL_LOADING_INCREMENT);
        setStatus("GETTING_GRAPH_STATS");

        const apexRoamPage = roamPages.get(selectedPage.id);
        const pathMap: ShortestPathLengthMapping = graph.getNodeAttribute(
          selectedPage.id,
          SHORTEST_PATH_KEY
        );

        addApexPage(selectedPage.id, apexRoamPage);
        addActivePages(pathMap, roamPages);
        setStatus("READY_TO_EMBED");
      }
    },
    [roamPages, graph, addApexPage, addActivePages, idb]
  );

  const checkIfDoneEmbedding = React.useCallback(
    (pagesDone: number) => {
      setLoadingIncrement((prevInc) => prevInc + pagesDone / (activePageIds.length + 1));
      setPagesLeft((prevPagesLeft) => prevPagesLeft - pagesDone);
    },
    [activePageIds]
  );

  React.useEffect(() => {
    if (idb.current && pagesLeft === 0) {
      const setSimilaritiesAsync = async () => {
        const tx = idb.current.transaction([SIMILARITIES_STORE, EMBEDDINGS_STORE], "readwrite");
        const embeddingsStore = tx.objectStore(EMBEDDINGS_STORE);
        const similaritiesStore = tx.objectStore(SIMILARITIES_STORE);

        const apexEmbedding = await embeddingsStore.get(apexPageId);
        const operations = [];

        for await (const { value: embedding, key } of embeddingsStore) {
          if (activePageIds.includes(key)) {
            operations.push(similaritiesStore.put(dot(apexEmbedding, embedding), key));
          }
        }

        await Promise.all(operations);
        await tx.done;

        setStatus("READY_TO_DISPLAY");
      };

      setSimilaritiesAsync();
    }
  }, [pagesLeft, idb, activePageIds, apexPageId]);

  React.useEffect(() => {
    if (status === "READY_TO_EMBED") {
      const initializeEmbeddingsAsync = async () => {
        setLoadingIncrement(INITIAL_LOADING_INCREMENT);

        const embeddingsKeys = await idb.current?.getAllKeys(EMBEDDINGS_STORE);
        const pageIdsToEmbed = [...activePageIds, apexPageId].filter((p) => {
          return !embeddingsKeys.includes(p);
        });

        if (pageIdsToEmbed.length > 0) {
          setPagesLeft(pageIdsToEmbed.length);

          for (let i = 0; i < pageIdsToEmbed.length; i += CHUNK_SIZE) {
            const chunkedPageIds = pageIdsToEmbed.slice(i, i + CHUNK_SIZE);
            await initializeEmbeddingWorker(chunkedPageIds, checkIfDoneEmbedding);
          }
        } else {
          setPagesLeft(0);
        }
      };

      initializeEmbeddingsAsync();
    }
  }, [status, checkIfDoneEmbedding, activePageIds, apexPageId, idb]);

  return status === "CREATING_GRAPH" ? (
    <Spinner></Spinner>
  ) : (
    <div className={gridStyles.container}>
      <div className={gridStyles.side}>
        <Card elevation={1}>
          <h5 className={styles.title}>selected page</h5>
          <PageSelect
            selectablePages={selectablePages}
            onPageSelect={pageSelectCallback}
          ></PageSelect>
        </Card>
      </div>
      <div className={gridStyles.body}>
        <div className={styles.graph}>
          <div className={styles.graphinner}>
            {status === "GRAPH_INITIALIZED" ? (
              "Select a page to get started"
            ) : status === "READY_TO_DISPLAY" ? (
              "Time to graph"
            ) : (
              <>
                <Spinner></Spinner>
                <ProgressBar value={loadingIncrement}></ProgressBar>
                {/* TODO explain this is a onetime ish load */}
              </>
            )}
            {/* <SpGraph graph={graph} activePages={activePages}></SpGraph> */}
          </div>
        </div>
        <DebugObject obj={graph.inspect()} />
      </div>
    </div>
  );
};
