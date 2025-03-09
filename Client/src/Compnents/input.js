import React from "react";

const Input = ({
  label = "",
  name = "",
  type = "text",
  className = "",
  inputclassName = "",
  isrequired = true,
  placeholder = "",
  value = "",
  onChange = () => {},
}) => {
  return (
    <div className={` ${inputclassName}`}>
      <label
        htmlFor={name}
        className="block  text-sm font-medium  text-gray-800"
      >
        {" "}
        {label}
      </label>
      <input
        type={type}
        id={name}
        // bg-gray-50 w-full
        className={` border border-gray-300 text-gray-900 text-sm rouded-lg
               focus:ring-blue-500 focus:border-blue-500 block  p-2.5 ${className}`}
        placeholder={placeholder}
        required={isrequired}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default Input;
