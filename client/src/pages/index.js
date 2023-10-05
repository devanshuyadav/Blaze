import Image from "next/image";
import { Inter } from "next/font/google";
import FileUpload from "@/components/FileUpload";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
    return (
        <main
            className={`flex min-h-screen flex-col items-center align-middle justify-center p-2 ${inter.className}`}
        >
            <div className="text-6xl p-6 font-bold flex flex-col">
                <div className="text-5xl">Welcome to</div>
                <div className="text-center">
                    <span className="text-6xl text-green-400">⚡Blaze</span>
                </div>
            </div>
            <FileUpload />
        </main>
    );
}
