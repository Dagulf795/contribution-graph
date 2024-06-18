import React, { useCallback, useEffect, useState, useRef } from "react";
import { Button, Dialog, Classes, Icon } from "@blueprintjs/core";
import { createTimes } from "../services/queries";  
import styles from "../styles/cg-button.module.css";
import { manipulateJson, generateContributionGraphSVG, splitSVGs, combineSVGs } from "../services/utils";
import { TimestampResult } from "../types/index";

interface CGButtonProps {
  modalOpen: boolean;
  toggleModal: () => void;
}

const CGButton: React.FC<CGButtonProps> = ({ modalOpen, toggleModal }) => {
  const [combinedSvg, setCombinedSvg] = useState('');
  const [dialogSize, setDialogSize] = useState<{ width: number, height: number }>({ width: 0, height: 0 });
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const closeModal = useCallback(() => {
    toggleModal();
  }, [toggleModal]);

  useEffect(() => {
    const generateSVG = async () => {
      const { timestamps }: TimestampResult = createTimes();
      const manipulatedData = manipulateJson(timestamps);
      const svgString = await generateContributionGraphSVG(manipulatedData);
      const svgArray = splitSVGs(svgString);
      const combinedSvg = combineSVGs(svgArray);
      setCombinedSvg(combinedSvg);
    };

    generateSVG();
  }, []);

  const handleOpen = useCallback(() => {
    if (svgContainerRef.current) {
      const svgElement = svgContainerRef.current.querySelector('svg');
      if (svgElement) {
        const width = svgElement.clientWidth;
        const height = svgElement.clientHeight;
        setDialogSize({ width: width + 40, height: height + 60 }); // Add some padding
        toggleModal(); // Open the modal after setting the size
      }
    }
  }, [combinedSvg, toggleModal]);


  return (
    <>
      <Button
        onClick={handleOpen} // Change from openModal to handleOpen
        style={{ margin: "0 0 0 10px" }}
        className="bp3-button bp3-minimal bp3-small"
      >
        <Icon icon="grid-view" />
      </Button>
            {/* Hidden container to measure SVG */}
      <div ref={svgContainerRef} style={{ position: 'absolute', top: '-9999px', left: '-9999px', visibility: 'hidden' }}>
        <div dangerouslySetInnerHTML={{ __html: combinedSvg }} />
      </div>
      <Dialog
        isOpen={modalOpen}
        onClose={closeModal}
        className={styles.dialogCenter}
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          width: dialogSize.width,
          height: dialogSize.height,
        }}
      >
        <div className={`${Classes.DIALOG_BODY} ${styles.graphbodywrap}`}>
          <div dangerouslySetInnerHTML={{ __html: combinedSvg }} className={styles.dialogContent} />
        </div>
      </Dialog>
    </>
  );
};

export default CGButton;
