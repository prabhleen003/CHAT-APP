import React from "react";

const Button = ({
  label = "Button",
  type = "button",
  className = "",
  disabled = false,
}) => {
  return (
    <div>
      <button
        type={type}
        className={`text-white  w--full hover:bg-primary focus: ring-4
         focus:outline-none focus: ring-blue-300 font-medium rounded-lg 
         text-sw-full  px-5 py-2.5 text-center  bg-primary 
        ${className}`}
        disabled={disabled}
      >
        {label}
      </button>
    </div>
  );
};

export default Button;
