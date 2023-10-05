import React, { useState } from "react";

export default function SelectLabels({
    columnLabels,
    setSelectedColumnLabels,
    filename,
}) {
    const [updatedColumnLabels, setUpdatedColumnLabels] = useState(
        columnLabels.map((label) => ({
            ColumnName: label,
            checked: false,
        }))
    );
    const [FileUploaded, setFileUploaded] = useState(false);
    const [spreadsheetID, setSpreadsheetID] = useState(null);

    // Function to toggle the checked state of a label
    const toggleLabelChecked = (index) => {
        const updatedLabels = [...updatedColumnLabels];
        updatedLabels[index].checked = !updatedLabels[index].checked;
        setUpdatedColumnLabels(updatedLabels);
    };

    const handleSubmit = () => {
        console.log(updatedColumnLabels);
        // setSelectedColumnLabels(updatedColumnLabels);
        handleImport(updatedColumnLabels);
    };

    const handleImport = (updatedColumnLabels) => {
        console.log("sending filename", filename);
        console.log("sending updatedColumn labels ", updatedColumnLabels);
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/import`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json", // Set the content type to JSON
            },
            body: JSON.stringify({
                filename: filename,
                preferredLabels: updatedColumnLabels,
            }),
        })
            .then((res) => {
                if (res.ok) {
                    return res.json();
                } else {
                    alert("Error uploading updated column data.");
                }
            })
            .then((data) => {
                console.log(data);
                console.log("API call to send Preferred columns complete");
                setFileUploaded(true);
                setSpreadsheetID(data.spreadsheetID);
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    };

    return (
        <div className="flex flex-col">
            {!FileUploaded ? (
                <>
                    <div className="text-center">
                        Highlight columns to import to Google Sheets
                    </div>
                    <div className="grid grid-cols-4 rounded-xl p-2">
                        {updatedColumnLabels.map((label, index) => {
                            return (
                                <div
                                    className={`${
                                        label.checked
                                            ? "border-green-400 bg-green-900"
                                            : "border-gray-800"
                                    } border-2 rounded-xl flex items-center justify-center m-2 p-4 hover:bg-zinc-800/30 cursor-pointer`}
                                    key={index}
                                    onClick={() => toggleLabelChecked(index)}
                                >
                                    {label.ColumnName}
                                </div>
                            );
                        })}
                    </div>
                    <button
                        onClick={handleSubmit}
                        className="hover:bg-green-900 rounded-xl flex items-center justify-center m-2 p-4 bg-zinc-800/30 cursor-pointer"
                    >
                        IMPORT
                    </button>
                </>
            ) : (
                <div>
                    ✅File Uploaded to Google Sheets,&nbsp;
                    <a
                        href={`https://docs.google.com/spreadsheets/d/${spreadsheetID}/`}
                        className="text-green-500"
                    >
                        open here
                    </a>
                </div>
            )}
        </div>
    );
}
