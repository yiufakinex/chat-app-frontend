import React from 'react';
import "../css/global.css";

interface LeftPanelProp extends React.PropsWithChildren { }

const LeftPanel: React.FC<LeftPanelProp> = ({ children }) => {
    return (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            {children}
        </div>
    );
};

export default LeftPanel;