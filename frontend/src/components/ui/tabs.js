import React from 'react';

const Tabs = ({ children, value, onValueChange }) => {
  return (
    <div className="tabs-container">
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return null;
        
        if (child.type === TabsList) {
          return React.cloneElement(child, { value, onValueChange });
        }
        
        if (child.type === TabsContent) {
          return child.props.value === value ? child : null;
        }
        
        return child;
      })}
    </div>
  );
};

const TabsList = ({ children, value, onValueChange }) => {
  return (
    <div className="flex space-x-1 border-b border-gray-200">
      {React.Children.map(children, child => {
        if (!React.isValidElement(child) || child.type !== TabsTrigger) return null;
        
        return React.cloneElement(child, { 
          isActive: child.props.value === value,
          onClick: () => onValueChange(child.props.value)
        });
      })}
    </div>
  );
};

const TabsTrigger = ({ children, value, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium ${
        isActive 
          ? 'border-b-2 border-primary-500 text-primary-600' 
          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ children, value }) => {
  return (
    <div className="py-4">
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };