'use client';

import React, { useCallback, useEffect } from "react";
import { useState } from "react";

interface ModalProps{
    label:string;
    close:() => void;
    Content:React.ReactElement;
    isOpen:boolean;
}
const Modals:React.FC<ModalProps>=({
    label,
    Content,
    isOpen,
    close
}) =>{
    const [ShowModal,setShowModal]=useState(isOpen)

    useEffect(() =>{
        setShowModal(isOpen)
    },[isOpen])

    const handleClose=useCallback(() =>{
        setShowModal(false);

        setTimeout(() => {
            close();
        }, 300);
    },[close])

    if(!isOpen){
        return null;
    }
    return(
       <div className="flex items-center justify-center fixed inset-0 z-40 bg-black/60">
            <div className="relative w-[90%] md:w-[80%] lg:w[700px] my-6 mx-auto h-auto">
                <div className={`translate duration-600 h-full ${ShowModal?'translate-y-0 opacity-100' : 'translate-y-full opacity-10'}`}>
                    <div className="w-full h-auto rounded-xl relative flex flex-col bg-white">
                        

                        <header className="h-[60px] flex items-center p-6 rounded-t justify-center relative border-b">
                            <div  
                               onClick={handleClose}
                               className="p-3 absolute left-3 hover:bg-gray-300 rounded-full cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                            </div>

                            <div  className="text-lg font-bold">{label}</div>
                        </header>

                        <section className="p-6">
                            {Content}
                        </section>
                    </div>
                </div>
            </div>
       </div>
    )
}
export default Modals;