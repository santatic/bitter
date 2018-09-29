import {
  ethereumCleaner
} from "../components/plugins/ethereumCleaner";

export const ethereumCleanerTest = () => ethereumCleaner.open({
  username: "namns.dev@gmail.com",
  password: "namnsdev:3"
});