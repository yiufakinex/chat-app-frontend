import React from 'react';
import "../css/global.css";

interface RightPanelProp extends React.PropsWithChildren { }

const RightPanel: React.FC<RightPanelProp> = ({ children }) => {
    return (
        <div className="flex-1 bg-white flex flex-col">
            {children}
        </div>
    );
};

export default RightPanel;