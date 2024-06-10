import React from "react";
import ReactDOM from "react-dom";
import SPButton from "./components/cg-button";

export default {
  onload: () => {
    const container = document.getElementsByClassName("rm-topbar")[0];
    const root = document.createElement("div");
    root.id = "contribution-graph";

    const searchBox = container.getElementsByClassName("rm-find-or-create-wrapper")[0];
    searchBox.insertAdjacentElement("afterend", root);

    ReactDOM.render(
      <>
        <SPButton />
      </>,
      root
    );
  },
  onunload: () => {
    const root = document.getElementById("contribution-graph");
    ReactDOM.unmountComponentAtNode(root);
    root.remove();
  },
};
