import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import CGButton from "./components/cg-button";

export default {
  onload: ({extensionAPI}: any) => {

    if (extensionAPI.settings.get("showButton") === undefined) {
      extensionAPI.settings.set("showButton", true);
    }
    // Create settings panel
    extensionAPI.settings.panel.create({
      tabTitle: "Contribution Graph",
      settings: [
        {
          id: "showButton",
          name: "Show Contribution Graph Button",
          description: "Toggle the visibility of the Contribution Graph button next to the search box.",
          action: {
            type: "switch",
            defaultValue: true, // Ensure the switch defaults to true
            onChange: (evt: any) => {
              const root = document.getElementById("contribution-graph");
              if (root) {
                root.style.display = evt.target.checked ? 'block' : 'none';
              }
              extensionAPI.settings.set("showButton", evt.target.checked);
            },
          },
        },
      ],
    });
    
    // Get the initial setting value
    const showButton = extensionAPI.settings.get("showButton") ?? true;

    // Find the container and create the root element  
    const container = document.getElementsByClassName("rm-topbar")[0];
    const root = document.createElement("div");
    root.id = "contribution-graph";
    root.style.display = showButton ? 'block' : 'none';


    // const searchBox = container.getElementsByClassName("rm-find-or-create-wrapper")[0];
    // searchBox.insertAdjacentElement("afterend", root);
    

    container.appendChild(root);


    const App = () => {
      const [modalOpen, setModalOpen] = useState(false);
      const toggleModal = () => {
        setModalOpen(prevState => !prevState);
      };

      useEffect(() => {
        // Register command palette command
        extensionAPI.ui.commandPalette.addCommand({
          label: "Toggle Contribution Graph",
          callback: toggleModal
        });
      }, []);

      return <CGButton modalOpen={modalOpen} toggleModal={toggleModal} />;
    };

    ReactDOM.render(<App />, root);
  },
  onunload: () => {
    const root = document.getElementById("contribution-graph");
    ReactDOM.unmountComponentAtNode(root);
    if (root) root.remove();
  },
};
