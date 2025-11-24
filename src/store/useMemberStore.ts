import {defineStore} from "pinia";

export const useMemberStore = defineStore("member", {
  state: () => {
    return {
      profile: {
        token: ""
      }
    }
  },
  actions: {
    clearProfile() {
      this.profile = {
        token: ""
      }
    }
  }
})