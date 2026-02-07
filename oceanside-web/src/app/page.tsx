import Image from "next/image";

export default function Home() {

  const title:string = "Ocean Side";
  const description:string="Ocean Side record video conversations";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
     <div>
     <h1 className="pb-2 text-2xl">{title}</h1>
     <p>{description}</p>
     </div>
    </div>
  );
}
