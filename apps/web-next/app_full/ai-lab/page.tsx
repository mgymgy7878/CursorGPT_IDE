import dynamic from "next/dynamic";
const AIChatPage = dynamic(()=>import('@/components/ai/AIChatPage'), { ssr:false });
export default function Page(){ return <AIChatPage/> } 