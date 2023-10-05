import { useState } from "react";
import { useRouter } from "next/router";
import SelectLabels from "./SelectLabels";

export default function FileUpload() {
    const [file, setFile] = useState(null);
    const [uploaded, setUploaded] = useState(false);
    const [columnLabels, setColumnLabels] = useState(null);
    const [selectedColumnLabels, setSelectedColumnLabels] = useState(null);
    const [filename, setFileName] = useState(null);
    const router = useRouter();

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        setFile(e.dataTransfer.files[0]);
        handleUpload(e.dataTransfer.files[0]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleUpload = (file) => {
        if (!file) {
            alert("Please select a file first.");
            return;
        }

        const formData = new FormData();
        formData.append("CSVFile", file);

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
            method: "POST",
            body: formData,
        })
            .then((res) => {
                if (res.ok) {
                    setUploaded(true);
                    return res.json();
                } else {
                    setUploaded(false);
                    alert("Error uploading file.");
                }
            })
            .then((data) => {
                setColumnLabels(data.preferredLabels);
                setFileName(data.filename);
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    };

    return (
        <div>
            <div>
                <div className="flex flex-col align-middle mx-auto border-neutral-800 bg-zinc-800/30 from-inherit rounded-xl border backdrop-blur-2xl bg-gray-200 p-4 dark:bg-zinc-800/30">
                    <div
                        onDrop={handleFileDrop}
                        onDragOver={handleDragOver}
                        className="border-2 border-gray-400 rounded-xl border-dashed text-center p-6 m-6"
                    >
                        {uploaded ? (
                            <div>✅File Uploaded</div>
                        ) : file ? (
                            <div>
                                <div className="flex justify-center items-center h-16">
                                    <div className="animate-spin rounded-full border-t-4 border-green-500 border-solid h-10 w-10"></div>
                                </div>
                                Uploading {file.name}
                            </div>
                        ) : (
                            <div>Drag and drop a file here to upload.</div>
                        )}
                    </div>
                    {!uploaded && (
                        <form>
                            <input type="file" onChange={handleFileChange} />
                            <button onClick={(e) => handleUpload(e)}>
                                Upload
                            </button>
                        </form>
                    )}
                    {columnLabels && (
                        <SelectLabels
                            setSelectedColumnLabels={setSelectedColumnLabels}
                            columnLabels={columnLabels}
                            filename={filename}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
