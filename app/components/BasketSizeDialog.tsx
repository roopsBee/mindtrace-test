import React, { useState } from "react";

interface Props {
  open: boolean;
  onClose: ({ width, height }: { width: number; height: number }) => void;
}

export const BasketSizeDialog: React.FC<Props> = ({ open, onClose }) => {
  const [width, setWidth] = useState(70);
  const [height, setHeight] = useState(70);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (width % 5 !== 0 || height % 5 !== 0) {
      setErrorMessage("The width and height must be divisible by 5.");
      return;
    }

    setErrorMessage("");
    onClose({ width, height });
  };

  const handleRoundInputs = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();

    setWidth(Math.round(width / 5) * 5);
    setHeight(Math.round(height / 5) * 5);
    setErrorMessage("");
  };

  return (
    <dialog
      className="absolute left-0 right-0 top-1/3 mx-auto w-96 rounded border border-gray-950 bg-gray-100 p-4"
      open={open}
    >
      <form method="dialog" onSubmit={handleSubmit}>
        <p className="pb-4">
          Input the size of the basket values must be between 10-70 and by
          divisible by 5
        </p>
        <label>
          Width:
          <input
            type="number"
            min="10"
            max="70"
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value))}
          />
        </label>
        <label>
          Height:
          <input
            type="number"
            min="10"
            max="70"
            value={height}
            onChange={(e) => setHeight(parseInt(e.target.value))}
          />
        </label>

        {errorMessage && <p className="py-2 text-red-800">{errorMessage}</p>}
        <div className="py-2">
          <button
            type="submit"
            className="mr-4 rounded border border-gray-800 p-2"
          >
            Submit
          </button>
          <button
            type="button"
            className="rounded border border-gray-800 p-2"
            onClick={handleRoundInputs}
          >
            Round Inputs
          </button>
        </div>
      </form>
    </dialog>
  );
};
