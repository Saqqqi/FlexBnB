"use client";

import Modals from "./Modals";
import { useState } from "react";
import { useRouter } from "next/navigation"; 
import UseLoginModal from "@/app/Hooks/UseLoginModal";
import CustomButton from "../Forms/CustomButton";
import { handleLogin } from "@/app/lib/actions";
import apiService from "../services/apiService";
import { useAuth } from "@clerk/nextjs";


const LoginModal = () => {
    const router = useRouter();
    const loginModal = UseLoginModal(); // Renamed to avoid conflict
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<string[]>([]);
    const { getToken, isSignedIn } = useAuth(); // Use hook inside the component

    const submitLogin= async()=>{
        const formData = {
            email: email,
            password: password
        }
        const token = await getToken({ template: 'Integration_flexbnb' }); // Fetch the token
        console.log('Token:', token);
        const response = await apiService.post('/api/auth/login/',JSON.stringify(formData),token);

        if(response.access){
            handleLogin(response.user.pk, response.access, response.refresh);
            
            loginModal.close();

            router.push('/')
        }else{
            setErrors(response.non_field_errors);
        }
    }

    const Content = (
        <>
            <h2 className="mb-6 text-2xl">Welcome To FlexBnB, Please Log-In</h2>

            <form 
                action={submitLogin}
                className="space-y-4"
            >
                <input onChange={(e)=>setEmail(e.target.value)} placeholder="Your Email Address" type="email" className="mb-4 px-4 w-full h-[54px] border border-gray-300 rounded-xl" />

                <input onChange={(e)=>setPassword(e.target.value)} placeholder="Your Password" type="password" className="mb-4 px-4 w-full h-[54px] border border-gray-300 rounded-xl" />

                {errors.map((error, index) => {
                    return (
                        <div key={`error_${index}`} 
                            className="p-5 bg-red-500 text-white rounded-xl opacity-80"
                        >
                            {error}
                        </div>
                    )
                    })}
                <CustomButton
                    label="Log-In"
                    onClick={submitLogin}
                />
                 
            </form>
        </>
    );

    return (
        <Modals
            isOpen={loginModal.isOpen}
            close={loginModal.close}
            label="Log-In"
            Content={Content} // Fixed prop name
        />
    );
};

export default LoginModal;
