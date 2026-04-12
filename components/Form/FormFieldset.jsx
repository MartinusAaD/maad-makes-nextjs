const FormFieldset = ({ legend, children }) => (
  <fieldset className="w-full flex flex-col justify-around p-8 gap-4 border-2 border-primary/40 bg-white rounded-md shadow-[0_0_10px_rgba(0,0,0,0.4)]">
    <legend className="text-lg font-bold bg-primary text-light px-8 py-2 rounded mb-4">
      {legend}
    </legend>
    {children}
  </fieldset>
);

export default FormFieldset;
