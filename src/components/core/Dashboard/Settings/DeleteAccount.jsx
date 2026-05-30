import { useState } from "react"
import { FiTrash2 } from "react-icons/fi"
import { useDispatch, useSelector } from "react-redux"
import { Link, useNavigate } from "react-router-dom"

import { deleteProfile } from "../../../../services/operations/SettingsAPI"
import { ACCOUNT_TYPE } from "../../../../utils/constants"
import IconBtn from "../../../common/IconBtn"

export default function DeleteAccount() {
  const { token } = useSelector((state) => state.auth)
  const { user } = useSelector((state) => state.profile)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [confirmationModal, setConfirmationModal] = useState(false)
  const [confirmationText, setConfirmationText] = useState("")
  const isInstructor = user?.accountType === ACCOUNT_TYPE.INSTRUCTOR

  async function handleDeleteAccount() {
    try {
      dispatch(deleteProfile(token, navigate))
      setConfirmationModal(false)
      setConfirmationText("")
    } catch (error) {
      console.log("ERROR MESSAGE - ", error.message)
    }
  }

  return (
    <>
      <div className="my-10 flex flex-row gap-x-5 rounded-md border-[1px] border-pink-700 bg-pink-900 p-8 px-12">
        <div className="flex aspect-square h-14 w-14 items-center justify-center rounded-full bg-pink-700">
          <FiTrash2 className="text-3xl text-pink-200" />
        </div>
        <div className="flex flex-col space-y-2">
          <h2 className="text-lg font-semibold text-richblack-5">
            Delete Account
          </h2>
          <div className="w-3/5 text-pink-25">
            <p>Would you like to delete account?</p>
            {isInstructor ? (
              <p>
                Please delete your courses before deleting your instructor
                account.
              </p>
            ) : (
              <p>
                This account may contain Paid Courses. Deleting your account is
                permanent and will remove all the contain associated with it.
              </p>
            )}
          </div>
          {isInstructor ? (
            <Link
              to="/dashboard/my-courses"
              className="w-fit cursor-pointer italic text-yellow-50"
            >
              Go to My Courses
            </Link>
          ) : (
            <button
              type="button"
              className="w-fit cursor-pointer italic text-pink-300"
              onClick={() => setConfirmationModal(true)}
            >
              I want to delete my account.
            </button>
          )}
        </div>
      </div>
      {confirmationModal && (
        <div className="fixed inset-0 z-[1000] !mt-0 grid place-items-center overflow-auto bg-white bg-opacity-10 backdrop-blur-sm">
          <div className="w-11/12 max-w-[420px] rounded-lg border border-pink-700 bg-richblack-800 p-6">
            <p className="text-2xl font-semibold text-richblack-5">
              Delete Account
            </p>
            <p className="mt-3 leading-6 text-richblack-200">
              This action is permanent. Type DELETE to confirm that you want to
              delete your account.
            </p>
            <input
              value={confirmationText}
              onChange={(event) => setConfirmationText(event.target.value)}
              className="form-style mt-5 w-full"
              placeholder="Type DELETE"
            />
            <div className="mt-6 flex items-center gap-x-4">
              <IconBtn
                disabled={confirmationText !== "DELETE"}
                onclick={handleDeleteAccount}
                text="Delete"
                customClasses={
                  confirmationText !== "DELETE"
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }
              />
              <button
                className="cursor-pointer rounded-md bg-richblack-200 py-[8px] px-[20px] font-semibold text-richblack-900"
                onClick={() => {
                  setConfirmationModal(false)
                  setConfirmationText("")
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
