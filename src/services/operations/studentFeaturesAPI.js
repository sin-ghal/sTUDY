import { toast } from "react-hot-toast";
import { studentEndpoints } from "../apis";
import { apiConnector } from "../apiconnector";
import rzpLogo from "../../assets/Logo/rzp_logo.png"
import { setPaymentLoading } from "../../slices/courseSlice";
import { resetCart } from "../../slices/cartSlice";
import { ACCOUNT_TYPE } from "../../utils/constants";


const {COURSE_PAYMENT_API, COURSE_VERIFY_API} = studentEndpoints;
const RAZORPAY_KEY =
    process.env.REACT_APP_RAZORPAY_KEY ||
    process.env.REACT_APP_RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY

function loadScript(src) {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;

        script.onload = () => {
            resolve(true);
        }
        script.onerror= () =>{
            resolve(false);
        }
        document.body.appendChild(script);
    })
}


export async function buyCourse(token, courses, userDetails, navigate, dispatch) {
    const toastId = toast.loading("Loading...");
    try{
        const courseId = Array.isArray(courses) ? courses[0] : courses

        if (!token) {
            toast.error("Please login as student to buy this course");
            navigate("/login");
            return;
        }

        if (!userDetails) {
            toast.error("User details not found. Please login again");
            return;
        }

        if (userDetails.accountType !== ACCOUNT_TYPE.STUDENT) {
            toast.error("Please login as student to buy this course");
            return;
        }

        if (!courseId) {
            toast.error("Please select a course to buy");
            return;
        }

        if (Array.isArray(courses) && courses.length > 1) {
            toast.error("Please buy one course at a time");
            return;
        }

        if (!RAZORPAY_KEY) {
            toast.error("Razorpay key is missing in frontend env");
            return;
        }

        //load the script
        const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");

        if(!res) {
            toast.error("RazorPay SDK failed to load");
            return;
        }

        //initiate the order
        const orderResponse = await apiConnector("POST", COURSE_PAYMENT_API, 
                                {courseId},
                                {
                                    Authorization: `Bearer ${token}`,
                                })

        if(!orderResponse.data.success) {
            throw new Error(orderResponse.data.message);
        }
        console.log("PRINTING orderResponse", orderResponse);
        const orderData = orderResponse.data.data;

        if (!orderData?.id || !orderData?.amount || !orderData?.currency) {
            throw new Error("Invalid payment order response from server");
        }
        //options
        const options = {
            key: RAZORPAY_KEY,
            currency: orderData.currency,
            amount: `${orderData.amount}`,
            order_id:orderData.id,
            name:"StudyNotion",
            description: "Thank You for Purchasing the Course",
            image:rzpLogo,
            prefill: {
                name:`${userDetails.firstName}`,
                email:userDetails.email
            },
            handler: function(response) {
                //verifyPayment
                verifyPayment({...response, courseId}, token, navigate, dispatch);
            }
        }
        //miss hogya tha 
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
        paymentObject.on("payment.failed", function(response) {
            toast.error("oops, payment failed");
            console.log(response.error);
        })

    }
    catch(error) {
        console.log("PAYMENT API ERROR.....", error);
        const errorMessage =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Could not make Payment";
        toast.error(errorMessage);
    }
    toast.dismiss(toastId);
}

//verify payment
async function verifyPayment(bodyData, token, navigate, dispatch) {
    const toastId = toast.loading("Verifying Payment....");
    dispatch(setPaymentLoading(true));
    try{
        const response  = await apiConnector("POST", COURSE_VERIFY_API, bodyData, {
            Authorization:`Bearer ${token}`,
        })

        if(!response.data.success) {
            throw new Error(response.data.message);
        }
        toast.success("payment Successful, ypou are addded to the course");
        navigate("/dashboard/enrolled-courses");
        dispatch(resetCart());
    }   
    catch(error) {
        console.log("PAYMENT VERIFY ERROR....", error);
        toast.error("Could not verify Payment");
    }
    toast.dismiss(toastId);
    dispatch(setPaymentLoading(false));
}
