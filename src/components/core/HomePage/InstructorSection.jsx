import React from 'react'
import CTAButton from "../../../components/core/HomePage/Button";
import { FaArrowRight } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Instructor from "../../../assets/Images/Instructor.png";
import HighlightText from './HighlightText';
import { ACCOUNT_TYPE } from "../../../utils/constants";

const InstructorSection = () => {
  const navigate = useNavigate()
  const { token } = useSelector((state) => state.auth)
  const { user } = useSelector((state) => state.profile)

  const handleTeachingClick = () => {
    if (!token) {
      navigate("/signup")
      return
    }

    if (user?.accountType === ACCOUNT_TYPE.INSTRUCTOR) {
      navigate("/dashboard/add-course")
      return
    }

    toast.error("Please login as instructor first")
  }

  return (
    <div>
        <div className="flex flex-col lg:flex-row gap-20 items-center">
          <div className="lg:w-[50%]">
            <img
              src={Instructor}
              alt=""
              className="shadow-white shadow-[-20px_-20px_0_0]"
            />
          </div>
          <div className="lg:w-[50%] flex gap-10 flex-col">
            <h1 className="lg:w-[50%] text-4xl font-semibold ">
              Become an
              <HighlightText text={"instructor"} />
            </h1>

            <p className="font-medium text-[16px] text-justify w-[90%] text-richblack-300">
              Instructors from around the world teach millions of students on
              ByteLearn. We provide the tools and skills to teach what you
              love.
            </p>

            <div className="w-fit">
              <CTAButton active={true} onclick={handleTeachingClick}>
                <div className="flex items-center gap-3">
                  Start Teaching Today
                  <FaArrowRight />
                </div>
              </CTAButton>
            </div>
          </div>
        </div>
    </div>
  )
}

export default InstructorSection
